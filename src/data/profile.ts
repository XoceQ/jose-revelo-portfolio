export const profile = {
  name: 'José Fernando Revelo',
  email: 'josefernandorevelo@gmail.com',
  github: 'https://github.com/XoceQ',
  linkedin: 'https://www.linkedin.com/in/josefernandorevelo/',
  cv: `${import.meta.env.BASE_URL}cv/Jose_Fernando_Revelo_CV.pdf`,
};

export const experienceTags: Record<string, string[]> = {
  foundever: ['Windows', 'Linux', 'TCP/IP', 'DNS', 'DHCP', 'VPN', 'VLAN', 'Salesforce', 'ServiceNow', 'Aruba', 'Cisco', 'Juniper', 'Netgear'],
  parquesoft: ['Laravel', 'MySQL', 'WordPress', 'HTML', 'CSS', 'Chatbots', 'IT Support'],
  dico: ['IT Support', 'Telecom'],
};

export const navItems = ['about', 'skills', 'experience', 'projects', 'services', 'contact'] as const;
